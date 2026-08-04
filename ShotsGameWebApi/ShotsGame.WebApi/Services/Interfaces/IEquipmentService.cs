using ShotsGame.Core.DTOs.Equipment;
using ShotsGame.Core.DTOs.Enhance;
using ShotsGame.Core.DTOs.Inventory;

namespace ShotsGame.WebApi.Services.Interfaces;

/// <summary>
/// 装备管理服务接口，负责玩家装备的获取、装备、卸下、生成、强化、附魔、镶嵌、分解与强化转移等业务
/// </summary>
public interface IEquipmentService
{
    /// <summary>
    /// 获取玩家已装备的物品列表
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>玩家已装备的物品列表，若不存在则返回 null</returns>
    Task<List<EquipmentOutput>?> GetEquippedItemsAsync(string playerId);

    /// <summary>
    /// 获取玩家装备仓库中的所有装备
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <returns>玩家装备仓库列表，若不存在则返回 null</returns>
    Task<List<EquipmentOutput>?> GetEquipmentStorageAsync(string playerId);

    /// <summary>
    /// 根据装备 ID 获取单个装备详情
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="equipmentId">装备唯一标识</param>
    /// <returns>单个装备详情，若不存在则返回 null</returns>
    Task<EquipmentOutput?> GetEquipmentAsync(string playerId, string equipmentId);

    /// <summary>
    /// 将指定装备装备到玩家身上
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">装备物品请求参数（包含装备 ID 与槽位信息）</param>
    /// <returns>装备后的物品详情，若失败则返回 null</returns>
    Task<EquipmentOutput?> EquipItemAsync(string playerId, EquipItemInput input);

    /// <summary>
    /// 将玩家身上指定槽位的装备卸下
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">卸下装备请求参数（包含槽位信息）</param>
    /// <returns>卸下后的物品详情，若失败则返回 null</returns>
    Task<EquipmentOutput?> UnequipItemAsync(string playerId, UnequipItemInput input);

    /// <summary>
    /// 根据生成规则随机生成一件装备
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">生成装备请求参数（包含稀有度、等级等配置）</param>
    /// <returns>新生成的装备详情，若失败则返回 null</returns>
    Task<EquipmentOutput?> GenerateEquipmentAsync(string playerId, GenerateEquipmentInput input);

    /// <summary>
    /// 对指定装备进行强化操作
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">强化装备请求参数（包含装备 ID 与强化材料）</param>
    /// <returns>强化结果详情，若失败则返回 null</returns>
    Task<EnhanceResultOutput?> EnhanceEquipmentAsync(string playerId, EnhanceEquipmentInput input);

    /// <summary>
    /// 对指定装备进行附魔操作
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">附魔装备请求参数（包含装备 ID 与附魔书）</param>
    /// <returns>附魔结果详情，若失败则返回 null</returns>
    Task<EnchantResultOutput?> EnchantEquipmentAsync(string playerId, EnchantEquipmentInput input);

    /// <summary>
    /// 向装备插槽中镶嵌宝石
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">镶嵌宝石请求参数（包含装备 ID、插槽索引与宝石 ID）</param>
    /// <returns>宝石镶嵌结果详情，若失败则返回 null</returns>
    Task<GemSocketResultOutput?> SocketGemAsync(string playerId, SocketGemInput input);

    /// <summary>
    /// 将指定装备分解为材料
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">分解装备请求参数（包含待分解的装备列表）</param>
    /// <returns>分解装备获得的物品与金币收益</returns>
    Task<SellItemsOutput?> DecomposeEquipmentAsync(string playerId, DecomposeEquipmentInput input);

    /// <summary>
    /// 将源装备的强化等级转移到目标装备
    /// </summary>
    /// <param name="playerId">玩家唯一标识</param>
    /// <param name="input">强化转移请求参数（包含源装备与目标装备 ID）</param>
    /// <returns>强化转移结果详情，若失败则返回 null</returns>
    Task<EnhanceResultOutput?> TransferEnhanceAsync(string playerId, TransferEnhanceInput input);
}
